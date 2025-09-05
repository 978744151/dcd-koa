const Router = require('koa-router');
const mongoose = require('mongoose');
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const BrandStore = require('../models/BrandStore');
const Brand = require('../models/Brand');
const Mall = require('../models/Mall');
const Dictionary = require('../models/Dictionary');

const router = new Router({
  prefix: '/api/map'
});

// 获取全国数据统计
router.get('/national', async (ctx) => {
  try {
    // 获取所有省份数据
    const provinces = await Province.find({ isActive: true });

    // 计算全国总数
    const totalBrands = provinces.reduce((sum, province) => sum + province.brandCount, 0);
    const totalMalls = provinces.reduce((sum, province) => sum + province.mallCount, 0);
    const totalDistricts = provinces.reduce((sum, province) => sum + province.districtCount, 0);

    ctx.body = {
      success: true,
      data: {
        totalProvinces: provinces.length,
        totalBrands,
        totalMalls,
        totalDistricts,
        provinces: provinces.map(province => ({
          id: province._id,
          name: province.name,
          code: province.code,
          brandCount: province.brandCount,
          mallCount: province.mallCount,
          districtCount: province.districtCount
        }))
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取全国数据失败',
      error: error.message
    };
  }
});

// 获取省份数据
router.get('/provinces', async (ctx) => {
  try {
    const { page = 1, limit = 0, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const provinces = await Province.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Province.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        provinces,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取省份数据失败',
      error: error.message
    };
  }
});

// 获取单个省份详情
router.get('/provinces/:id', async (ctx) => {
  try {
    const province = await Province.findById(ctx.params.id);
    if (!province) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '省份不存在'
      };
      return;
    }

    // 获取该省份下的城市列表
    const cities = await City.find({ province: province._id, isActive: true })
      .select('name code brandCount mallCount districtCount')
      .sort({ name: 1 });

    ctx.body = {
      success: true,
      data: {
        province: {
          id: province._id,
          name: province.name,
          code: province.code,
          brandCount: province.brandCount,
          mallCount: province.mallCount,
          districtCount: province.districtCount
        },
        cities
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取省份详情失败',
      error: error.message
    };
  }
});

// 获取城市数据
router.get('/cities', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const cities = await City.find(query)
      .populate('province', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await City.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        cities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取城市数据失败',
      error: error.message
    };
  }
});

// 获取单个城市详情
router.get('/cities/:id', async (ctx) => {
  try {
    const city = await City.findById(ctx.params.id).populate('province', 'name');
    if (!city) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '城市不存在'
      };
      return;
    }

    // 获取该城市下的区县列表
    const districts = await District.find({ city: city._id, isActive: true })
      .select('name code brandCount mallCount')
      .sort({ name: 1 });

    ctx.body = {
      success: true,
      data: {
        city: {
          id: city._id,
          name: city.name,
          code: city.code,
          province: city.province,
          brandCount: city.brandCount,
          mallCount: city.mallCount,
          districtCount: city.districtCount
        },
        districts
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取城市详情失败',
      error: error.message
    };
  }
});

// 获取区县数据
router.get('/districts', async (ctx) => {
  try {
    const { page = 1, limit = 0, cityId, provinceId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (cityId) {
      query.city = cityId;
    }
    if (provinceId) {
      query.province = provinceId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const districts = await District.find(query)
      .populate('city', 'name')
      .populate('province', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await District.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        districts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取区县数据失败',
      error: error.message
    };
  }
});

// 获取品牌数据
router.get('/brands', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, cityId, districtId, search } = ctx.query;
    const skip = (page - 1) * limit;

    // 列表模式
    let query = { isActive: true };
    if (provinceId) query.province = provinceId;
    if (cityId) query.city = cityId;
    if (districtId) query.district = districtId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const brands = await Brand.find(query)
      .populate('province', 'name')
      .populate('city', 'name')
      .populate('district', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ sort: -1, createdAt: -1 });

    // 获取品牌分类字典数据
    const brandCategoryDict = await Dictionary.find({
      type: 'brand_category',
      isActive: true
    }).lean();

    // 创建字典映射
    const categoryMap = {};
    brandCategoryDict.forEach(dict => {
      categoryMap[dict.value] = dict.label;
    });

    // 为每个品牌添加门店数量和分类转换
    const brandsWithStoreCount = await Promise.all(
      brands.map(async (brand) => {
        let storeQuery = { brand: brand._id, isActive: true };
        if (provinceId) storeQuery.province = provinceId;
        if (cityId) storeQuery.city = cityId;
        if (districtId) storeQuery.district = districtId;

        const storeCount = await BrandStore.countDocuments(storeQuery);
        const brandObj = brand.toObject();

        return {
          ...brandObj,
          storeCount,
          categoryStr: categoryMap[brandObj.category] || brandObj.category || ''
        };
      })
    );

    const total = await Brand.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        brands: brandsWithStoreCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取品牌数据失败',
      error: error.message
    };
  }
});

// 简化的品牌详情接口
router.get('/brands/detail', async (ctx) => {
  try {
    const { brandId } = ctx.query;

    // 验证必需参数
    if (!brandId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '品牌ID是必需的参数'
      };
      return;
    }

    // 获取品牌基本信息
    const brand = await Brand.findById(brandId)
      .populate('province', 'name code')
      .populate('city', 'name code')
      .populate('district', 'name code')
      .select('name code description logo website category province city district address contactPhone contactEmail isActive createdAt updatedAt');

    if (!brand) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '品牌不存在'
      };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        brand
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取品牌详情失败',
      error: error.message
    };
  }
});

// 获取树形结构数据（省 -> 市 -> 区 -> 商场 -> 品牌）
router.get('/tree', async (ctx) => {
  try {
    const { provinceId, cityId, districtId, search, brandId, level = 3 } = ctx.query;
    const queryLevel = parseInt(level);

    // 第一步：获取所有省份的基础结构
    let provinceQuery = {};
    if (provinceId) provinceQuery._id = provinceId;

    const allProvinces = await Province.find(provinceQuery).sort({ code: 1 });

    // 根据level参数决定返回的层级深度
    if (queryLevel === 1) {
      // 只返回省份，包含统计信息
      const provinces = await Promise.all(allProvinces.map(async (province) => {
        // 统计该省份的商场和品牌数量
        let storeQuery = { isActive: true, province: province._id };
        if (brandId) {
          const brandStores = await BrandStore.find({ ...storeQuery, brand: brandId });
          const mallCount = new Set(brandStores.map(store => store.mall.toString())).size;
          const brandCount = brandId ? 1 : 0;

          return {
            _id: province._id,
            name: province.name,
            code: province.code,
            mallCount,
            brandCount,
            storeCount: brandStores.length
          };
        } else {
          const [mallCount, brandCount, storeCount] = await Promise.all([
            BrandStore.distinct('mall', storeQuery).then(malls => malls.length),
            BrandStore.distinct('brand', storeQuery).then(brands => brands.length),
            BrandStore.countDocuments(storeQuery)
          ]);

          return {
            _id: province._id,
            name: province.name,
            code: province.code,
            mallCount,
            brandCount,
            storeCount
          };
        }
      }));

      ctx.body = { success: true, data: { provinces } };
      return;
    }

    // 构建完整的省市区树形结构
    const provinces = await Promise.all(allProvinces.map(async (province) => {
      // 获取该省份下的所有城市
      let cityQuery = { province: province._id };
      if (cityId) cityQuery._id = cityId;

      const cities = await City.find(cityQuery).sort({ code: 1 });

      if (queryLevel === 2) {
        // 返回省市，包含统计信息
        const citiesData = await Promise.all(cities.map(async (city) => {
          let storeQuery = { isActive: true, province: province._id, city: city._id };

          if (brandId) {
            const brandStores = await BrandStore.find({ ...storeQuery, brand: brandId });
            const mallCount = new Set(brandStores.map(store => store.mall.toString())).size;
            const brandCount = brandId ? 1 : 0;

            return {
              _id: city._id,
              name: city.name,
              code: city.code,
              mallCount,
              brandCount,
              storeCount: brandStores.length
            };
          } else {
            const [mallCount, brandCount, storeCount] = await Promise.all([
              BrandStore.distinct('mall', storeQuery).then(malls => malls.length),
              BrandStore.distinct('brand', storeQuery).then(brands => brands.length),
              BrandStore.countDocuments(storeQuery)
            ]);

            return {
              _id: city._id,
              name: city.name,
              code: city.code,
              mallCount,
              brandCount,
              storeCount
            };
          }
        }));

        // 计算省份统计
        const provinceMallCount = citiesData.reduce((sum, city) => sum + city.mallCount, 0);
        const provinceBrandCount = citiesData.reduce((sum, city) => sum + city.brandCount, 0);
        const provinceStoreCount = citiesData.reduce((sum, city) => sum + city.storeCount, 0);

        return {
          _id: province._id,
          name: province.name,
          code: province.code,
          mallCount: provinceMallCount,
          brandCount: provinceBrandCount,
          storeCount: provinceStoreCount,
          cities: citiesData
        };
      }

      // level >= 3，返回省市区及商场品牌数据，包含统计信息
      const citiesWithDistricts = await Promise.all(cities.map(async (city) => {
        // 获取该城市下的所有区县
        let districtQuery = { city: city._id };
        if (districtId) districtQuery._id = districtId;

        const districts = await District.find(districtQuery).sort({ code: 1 });

        // 为每个区县获取商场和品牌数据
        const districtsWithMalls = await Promise.all(districts.map(async (district) => {
          // 构建门店查询条件
          let storeQuery = {
            isActive: true,
            province: province._id,
            city: city._id,
            district: district._id
          };

          // 获取该区县下的门店数据
          const storesPipeline = [
            { $match: storeQuery },
            { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
            { $unwind: '$brand' },
            ...(brandId ? [{ $match: { 'brand._id': new mongoose.Types.ObjectId(brandId) } }] : []),
            ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
            { $lookup: { from: 'malls', localField: 'mall', foreignField: '_id', as: 'mall' } },
            { $unwind: '$mall' },
            {
              $group: {
                _id: '$mall._id',
                mall: { $first: '$mall' },
                brands: {
                  $addToSet: {
                    _id: '$brand._id',
                    name: '$brand.name',
                    code: '$brand.code'
                  }
                }
              }
            }
          ];

          const mallsWithBrands = await BrandStore.aggregate(storesPipeline);

          const malls = mallsWithBrands.map(m => ({
            _id: m.mall._id,
            name: m.mall.name,
            code: m.mall.code,
            brands: m.brands
          }));

          // 计算区县统计
          const mallCount = malls.length;
          const brandCount = new Set(malls.flatMap(m => m.brands.map(b => b._id.toString()))).size;
          const storeCount = await BrandStore.countDocuments(storeQuery);

          return {
            _id: district._id,
            name: district.name,
            code: district.code,
            mallCount,
            brandCount,
            storeCount,
            malls
          };
        }));

        // 同时获取该城市下直辖的商场（没有区县的情况）
        let directStoreQuery = {
          isActive: true,
          province: province._id,
          city: city._id,
          $or: [
            { district: { $exists: false } },
            { district: null }
          ]
        };

        const directStoresPipeline = [
          { $match: directStoreQuery },
          { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
          { $unwind: '$brand' },
          ...(brandId ? [{ $match: { 'brand._id': new mongoose.Types.ObjectId(brandId) } }] : []),
          ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
          { $lookup: { from: 'malls', localField: 'mall', foreignField: '_id', as: 'mall' } },
          { $unwind: '$mall' },
          {
            $group: {
              _id: '$mall._id',
              mall: { $first: '$mall' },
              brands: {
                $addToSet: {
                  _id: '$brand._id',
                  name: '$brand.name',
                  code: '$brand.code'
                }
              }
            }
          }
        ];

        const directMallsWithBrands = await BrandStore.aggregate(directStoresPipeline);

        const directMalls = directMallsWithBrands.map(m => ({
          _id: m.mall._id,
          name: m.mall.name,
          code: m.mall.code,
          brands: m.brands
        }));

        // 计算城市统计（包含区县和直辖商场）
        const districtMallCount = districtsWithMalls.reduce((sum, d) => sum + d.mallCount, 0);
        const districtBrandCount = districtsWithMalls.reduce((sum, d) => sum + d.brandCount, 0);
        const districtStoreCount = districtsWithMalls.reduce((sum, d) => sum + d.storeCount, 0);

        const directMallCount = directMalls.length;
        const directBrandCount = new Set(directMalls.flatMap(m => m.brands.map(b => b._id.toString()))).size;
        const directStoreCount = await BrandStore.countDocuments(directStoreQuery);

        return {
          _id: city._id,
          name: city.name,
          code: city.code,
          mallCount: districtMallCount + directMallCount,
          brandCount: districtBrandCount + directBrandCount,
          storeCount: districtStoreCount + directStoreCount,
          districts: districtsWithMalls,
          malls: directMalls // 直辖商场
        };
      }));

      // 计算省份统计
      const provinceMallCount = citiesWithDistricts.reduce((sum, city) => sum + city.mallCount, 0);
      const provinceBrandCount = citiesWithDistricts.reduce((sum, city) => sum + city.brandCount, 0);
      const provinceStoreCount = citiesWithDistricts.reduce((sum, city) => sum + city.storeCount, 0);

      return {
        _id: province._id,
        name: province.name,
        code: province.code,
        mallCount: provinceMallCount,
        brandCount: provinceBrandCount,
        storeCount: provinceStoreCount,
        cities: citiesWithDistricts
      };
    }));

    ctx.body = { success: true, data: { provinces } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取树形数据失败',
      error: error.message
    };
  }
});

// 修复后的品牌门店详情接口
router.get('/brandDetail', async (ctx) => {
  try {
    const { provinceId, cityId, districtId, brandId, search, page = 1, limit = 20 } = ctx.query;
    const skip = (page - 1) * limit;

    // 验证必需参数
    if (!brandId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '品牌ID是必需的参数'
      };
      return;
    }

    if (!provinceId && !cityId && !districtId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '请至少提供省份、城市或区县ID中的一个'
      };
      return;
    }

    // 验证品牌是否存在
    const brand = await Brand.findById(brandId);
    if (!brand) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '品牌不存在'
      };
      return;
    }

    // 构建查询条件
    let storeQuery = {
      isActive: true,
      brand: brandId
    };

    // 根据传入的地理位置参数构建查询条件
    if (districtId) {
      storeQuery.district = districtId;
    } else if (cityId) {
      storeQuery.city = cityId;
    } else if (provinceId) {
      storeQuery.province = provinceId;
    }


    // 先检查是否有匹配的原始数据
    const rawCount = await BrandStore.countDocuments(storeQuery);
    console.log('匹配的原始数据数量:', rawCount);

    if (rawCount === 0) {
      console.log('没有找到匹配的门店数据');
      // 检查是否有该品牌的任何门店
      const brandStoreCount = await BrandStore.countDocuments({ brand: brandId, isActive: true });
      console.log('该品牌总门店数量:', brandStoreCount);

      if (brandStoreCount === 0) {
        console.log('该品牌没有任何门店数据');
      } else {
        console.log('该品牌有门店，但不在指定地区');
        // 查看该品牌的门店分布
        const brandStores = await BrandStore.find({ brand: brandId, isActive: true })
          .select('province city district storeName')
          .limit(5);
        console.log('该品牌的部分门店分布:', brandStores);
      }
    }

    // 在第927行附近，替换现有的聚合管道
    // 替换原有的聚合管道
    const pipeline = [
      { $match: storeQuery },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandInfo'
        }
      },
      {
        $lookup: {
          from: 'malls',
          localField: 'mall',
          foreignField: '_id',
          as: 'mallInfo'
        }
      },
      {
        $lookup: {
          from: 'provinces',
          localField: 'province',
          foreignField: '_id',
          as: 'provinceInfo'
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'cityInfo'
        }
      },
      {
        $lookup: {
          from: 'districts',
          localField: 'district',
          foreignField: '_id',
          as: 'districtInfo'
        }
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ['$brandInfo', 0] },
          mall: { $arrayElemAt: ['$mallInfo', 0] },
          province: { $arrayElemAt: ['$provinceInfo', 0] },
          city: { $arrayElemAt: ['$cityInfo', 0] },
          district: { $arrayElemAt: ['$districtInfo', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          storeName: 1,
          storeAddress: 1,
          isOla: 1,
          floor: 1,
          unitNumber: 1,
          openingHours: 1,
          phone: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          brand: {
            _id: '$brand._id',
            name: '$brand.name',
            code: '$brand.code',
            category: '$brand.category',
            website: '$brand.website',
            logo: '$brand.logo',
            description: '$brand.description'
          },
          mall: {
            _id: '$mall._id',
            name: '$mall.name',
            code: '$mall.code',
            address: '$mall.address',
            phone: '$mall.phone'
          },
          province: {
            _id: '$province._id',
            name: '$province.name',
            code: '$province.code'
          },
          city: {
            _id: '$city._id',
            name: '$city.name',
            code: '$city.code'
          },
          district: {
            _id: '$district._id',
            name: '$district.name',
            code: '$district.code'
          }
        }
      },
      { $sort: { 'province.name': 1, 'city.name': 1, 'district.name': 1, 'storeName': 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];


    // 获取门店数据
    // 使用 populate 查询
    const stores = await BrandStore.find(storeQuery)
      .populate('brand', '_id name code category website logo description')
      .populate('mall', '_id name code address phone')
      .populate('province', '_id name code')
      .populate('city', '_id name code')
      .populate('district', '_id name code')
      .sort({ storeName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    console.log('聚合管道:', stores);

    if (stores.length > 0) {
      console.log('第一个门店数据:', JSON.stringify(stores[0], null, 2));
    } else {
      // 如果还是没有数据，尝试最简单的聚合
      console.log('尝试最简单的聚合查询...');
      const simpleStores = await BrandStore.aggregate([
        { $match: storeQuery },
        { $limit: 5 }
      ]);
      console.log('简单聚合结果:', simpleStores.length, simpleStores);
    }
    // 获取总数（简化版本）
    const total = await BrandStore.countDocuments(storeQuery);

    // 获取区域信息
    let regionInfo = {};
    if (provinceId) {
      const province = await Province.findById(provinceId).select('_id name code');
      if (province) regionInfo.province = province;
    }
    if (cityId) {
      const city = await City.findById(cityId).select('_id name code');
      if (city) regionInfo.city = city;
    }
    if (districtId) {
      const district = await District.findById(districtId).select('_id name code');
      if (district) regionInfo.district = district;
    }

    ctx.body = {
      success: true,
      data: {
        brand,
        stores,
        regionInfo,
        stats: {
          storeCount: total
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取品牌门店详情失败',
      error: error.message
    };
  }
});

// 获取商场数据
router.get('/malls', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, cityId, districtId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (cityId) {
      query.city = cityId;
    }
    if (districtId) {
      query.district = districtId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const malls = await Mall.find(query)
      .populate('province', 'name')
      .populate('city', 'name')
      .populate('district', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Mall.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        malls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取商场数据失败',
      error: error.message
    };
  }
});

// 获取统计数据
router.get('/statistics', async (ctx) => {
  try {
    const { provinceId, cityId, districtId } = ctx.query;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (cityId) {
      query.city = cityId;
    }
    if (districtId) {
      query.district = districtId;
    }

    const brandCount = await Brand.countDocuments(query);
    const mallCount = await Mall.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        brandCount,
        mallCount
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取统计数据失败',
      error: error.message
    };
  }
});

// 获取字典数据（供前端使用）
router.get('/dictionaries', async (ctx) => {
  try {
    const { type, types } = ctx.query;

    let query = { isActive: true };

    if (type) {
      // 获取单个类型的字典项
      query.type = type;

      const dictionaries = await Dictionary.find(query)
        .select('label value sort description')
        .sort({ sort: 1, createdAt: 1 });

      ctx.body = {
        success: true,
        data: {
          type,
          items: dictionaries.map(item => ({
            label: item.label,
            value: item.value,
            description: item.description
          }))
        }
      };
    } else if (types) {
      // 获取多个类型的字典项
      const typeArray = types.split(',');
      const result = {};

      for (const t of typeArray) {
        const dictionaries = await Dictionary.find({ type: t, isActive: true })
          .select('label value sort description')
          .sort({ sort: 1, createdAt: 1 });

        result[t] = dictionaries.map(item => ({
          label: item.label,
          value: item.value,
          description: item.description
        }));
      }

      ctx.body = {
        success: true,
        data: result
      };
    } else {
      // 获取所有字典项，按类型分组
      const dictionaries = await Dictionary.find(query)
        .select('type label value sort description')
        .sort({ type: 1, sort: 1, createdAt: 1 });

      const grouped = {};
      dictionaries.forEach(item => {
        if (!grouped[item.type]) {
          grouped[item.type] = [];
        }
        grouped[item.type].push({
          label: item.label,
          value: item.value,
          description: item.description
        });
      });

      ctx.body = {
        success: true,
        data: grouped
      };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取字典数据失败',
      error: error.message
    };
  }
});
// ... existing code ...
module.exports = router;